# Main template class
class Gunther.Template

    # additional DOM parsers, can be used to set up plugins, etc.
    @domParsers = []

    # Create a DOM element
    @createHtmlElement: (tagName) -> $(document.createElement tagName)

    # Add attributes to a DOM element
    @addAttributes: (el, attributes) ->
        # For every attribute object set
        for attribute in attributes
            for attributeName, attributeValue of attribute
                do (attributeName, attributeValue) ->
                    # Bind events
                    if _.include Gunther.HTML.eventNames, attributeName
                        el.bind attributeName, (args...) ->
                            attributeValue args...

                    # See if we get a BoundProperty, which we bind to (and set)
                    else if attributeValue instanceof BoundProperty
                        # Set the base attribute
                        el.attr attributeName, attributeValue.getValue()
                        # On change re-set the attribute
                        attributeValue.bind 'change', (newValue) -> el.attr attributeName, newValue

                    # Else try to set directly
                    else
                        el.attr attributeName, attributeValue

    # Generate children for a DOM element
    @generateChildren: (el, childFn, scope) ->
        # Do the actual recursion, setting up the scope proper, and passing the parent element
        childResult = childFn.apply scope

        # Make sure we get a result in the first place
        return if childResult is undefined

        # If the child generator returns a string, we have to append it as a text element to the current element
        el.append document.createTextNode childResult if typeof childResult isnt 'object'

        # If we get a bound property, we set up the initial value, as well as a change watcher
        if childResult instanceof BoundProperty

            # Initial generated value
            childResult.getValueInEl el

            # Track changes
            childResult.bind 'change', (newVal) ->
                # Empty the node for updates
                el.empty()

                childResult.getValueInEl el

        # The child is a new View instance, we set up the proper element and render it
        else if childResult instanceof Backbone.View
            childResult.setElement el
            childResult.render()

    # Constructor
    constructor: (@fn) -> null

    # Render
    render: (args...) ->
        # Set up a root element, its children will be transferred
        @root = $('<div />')

        # Current element, starts out as the root element, but will change in the tree
        @current = @root

        # Start the template function
        @fn.apply this, args

        # Add all children of root to the element we're supposed to render into
        children = @root.children()

        # Parse dom with the DOM parsers
        for domParser in Gunther.Template.domParsers
            for child in children
                domParser child

        children
        # Do we remove them from root afterwards?
        #@root.remove()

    # Render into an element
    #
    # Will return a Backbone.View that can be used/modified to your wishes
    renderInto: (el, args...) ->
        ($ el).append child for child in @render args...

        # Return a view
        new Backbone.View
            el: ($ el)

    # Add text to the current element
    #
    # This will create a text node and append it to the current element, the
    # contents of which can be either a string, or a bound property (see
    # @bind())
    text: (text) ->

        # Create text node
        el = document.createTextNode ''

        # Set the contents of the child node
        if typeof text is 'string'
            el.nodeValue = text
        else
            # If a function is passed, call it
            childResult = text.apply this if typeof text is 'function'

            # If we get a bound property, we set up the initial value, as well as a change watcher
            if childResult instanceof BoundProperty
                el.nodeValue = childResult.getValue()
                childResult.bind 'change', (newVal) ->
                    el.nodeValue = newVal

        # Append the child node
        @current.append el

    # Create a child to @current, recurse and add children to it, etc.
    addElement: (tagName, args...) ->
        # Element we're working on starts out with the current one set up in
        # the this scope, but will change in the child, so we keep a copy here
        current = @current

        # Element to render in
        el = Gunther.Template.createHtmlElement tagName

        # Change current element to the newly created one for our children
        @current = el

        # We have to recurse, if the last argument passed is a function
        if typeof args[args.length - 1] is 'function'
            Gunther.Template.generateChildren el, args.pop(), this

        # If we get passed a string as last value, set it as the node value
        else if typeof args[args.length - 1] is 'string'
            el.nodeValue = args.pop()

        # Set up the attributes for the element
        Gunther.Template.addAttributes el, args

        # Append it to the current element
        current.append el

        # Set the now current again element in the this scope
        @current = current

        null

    # Append an element
    append: (element) ->
        if element instanceof Backbone.View
            # Render the view
            element.render()

            # Append its element
            @current.append element.el
        else
            @current.append element

    # Render a sub-template
    subTemplate: (template, args...) -> template.renderInto @current, args...

    # Bind to a property of a model
    bind: (args...) -> new BoundProperty args...

    # Set up a subview for every item in the collection
    itemSubView: (options) -> new ItemSubView options

    # Shortcut for addElement
    e: (tagName, args...) -> @addElement tagName, args...

    # Shortcut for add text
    t: (args...) -> @text args...

# Set up all HTML elements as functions
for htmlElement in Gunther.HTML.elements
    do (htmlElement) -> # gotta love for...do :)
        Gunther.Template::[htmlElement] = (args...) ->
            @addElement htmlElement, args...
