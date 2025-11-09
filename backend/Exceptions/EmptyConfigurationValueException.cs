namespace backend.Exceptions
{
    /// <summary>
    /// Exception thrown when a required configuration value is empty or missing.
    /// </summary>
    public class EmptyConfigurationValueException : Exception
    {
        public EmptyConfigurationValueException() { }
        public EmptyConfigurationValueException(string message) : base(message) { }
        public EmptyConfigurationValueException(string message, Exception innerException) : base(message, innerException) { }
    }
}
